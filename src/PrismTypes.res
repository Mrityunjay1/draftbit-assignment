type side = Top | Right | Bottom | Left

type value = {
  value: string,
  unit: string,
}

type prismState = {
  top: option<value>,
  right: option<value>,
  bottom: option<value>,
  left: option<value>,
}

type inputState = Default | Changed | Focused

@module("./PropertiesPanel.css") external styles: {..} = "default"
