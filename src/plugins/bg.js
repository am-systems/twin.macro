const handleColor = ({ toColor }) => {
  const common = {
    matchStart: 'bg',
    property: 'backgroundColor',
    configSearch: 'backgroundColor',
  }
  return toColor([{ ...common, opacityVariable: '--tw-bg-opacity' }, common])
}

const handleSize = ({ configValue, important }) => {
  const value = configValue('backgroundSize')
  if (!value) return

  return { backgroundSize: `${value}${important}` }
}

const handlePosition = ({ configValue, important }) => {
  const value = configValue('backgroundPosition')
  if (!value) return

  return { backgroundPosition: `${value}${important}` }
}

const handleImage = ({ configValue, important }) => {
  const value = configValue('backgroundImage')
  if (!value) return

  return { backgroundImage: `${value}${important}` }
}

export default properties => {
  const {
    theme,
    match,
    toColor,
    getConfigValue,
    errors: { errorSuggestions },
    pieces: { important },
  } = properties

  const color = handleColor({ toColor })
  if (color) return color

  const classValue = match(/(?<=(bg)-)([^]*)/)
  const configValue = config => getConfigValue(theme(config), classValue)

  const size = handleSize({ configValue, important })
  if (size) return size

  const position = handlePosition({ configValue, important })
  if (position) return position

  const image = handleImage({ configValue, important })
  if (image) return image

  errorSuggestions({
    config: [
      'backgroundColor',
      'backgroundSize',
      'backgroundPosition',
      'backgroundImage',
    ],
  })
}
