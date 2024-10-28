import "dotenv/config";
import { Client } from "pg";
import { backOff } from "exponential-backoff";
import express from "express";
import waitOn from "wait-on";
import onExit from "signal-exit";
import cors from "cors";

// Define types for our component properties
interface ComponentProperties {
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  padding: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
}

// Setup the Express application with routes
const setupApp = (client: Client): express.Application => {
  const app: express.Application = express();

  app.use(cors());
  app.use(express.json());

  //create /examples endpont
  app.get("/examples", async (req, res) => {
    try {
      const { rows } = await client.query("SELECT * FROM example_table");
      res.json(rows);
    } catch (err) {
      console.error("Error fetching examples:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get properties for a component
  app.get("/api/properties/:componentId", async (req, res) => {
    const { componentId } = req.params;
    try {
      const { rows } = await client.query(
        "SELECT margin, padding FROM component_properties WHERE component_id = $1",
        [componentId]
      );
      if (rows.length > 0) {
        res.json(rows[0]);
      } else {
        res.json({
          margin: { top: "auto", right: "auto", bottom: "auto", left: "auto" },
          padding: { top: "auto", right: "auto", bottom: "auto", left: "auto" },
        });
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update properties for a component
  app.post("/api/properties/:componentId", async (req, res) => {
    const { componentId } = req.params;
    const { margin, padding }: ComponentProperties = req.body;
    try {
      await client.query(
        `INSERT INTO component_properties (component_id, margin, padding)
         VALUES ($1, $2, $3)
         ON CONFLICT (component_id) DO UPDATE
         SET margin = $2, padding = $3`,
        [componentId, JSON.stringify(margin), JSON.stringify(padding)]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating properties:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app;
};

// Waits for the database to start and connects
const connect = async (): Promise<Client> => {
  console.log("Connecting to database...");
  const resource = `tcp:${process.env.PGHOST}:${process.env.PGPORT}`;
  console.log(`Waiting for ${resource}`);
  await waitOn({ resources: [resource] });
  console.log("Initializing client");
  const client = new Client();

  try {
    await backOff(() => client.connect(), {
      numOfAttempts: 5,
      startingDelay: 1000,
      timeMultiple: 2,
    });
    console.log("Connected to database");

    // Ensure the client disconnects on exit
    onExit(async () => {
      console.log("onExit: closing client");
      await client.end();
    });

    return client;
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }
};

const main = async () => {
  try {
    const client = await connect();
    const app = setupApp(client);
    const port = parseInt(process.env.SERVER_PORT || "3000");
    app.listen(port, () => {
      console.log(
        `Draftbit Coding Challenge is running at http://localhost:${port}/`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

main();
