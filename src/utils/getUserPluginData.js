import processPlugins from 'tailwindcss/lib/util/processPlugins'
import deepMerge from 'lodash.merge'
import { camelize } from './../utils'

const stripLeadingDot = string =>
  string.startsWith('.') ? string.slice(1) : string

const replaceSelectorWithParent = (string, replacement) =>
  string.replace(replacement, `{{${stripLeadingDot(replacement)}}}`)

const parseSelector = (selector, { isBase }) => {
  if (!selector) return

  const matches = selector.trim().match(/^(\S+)(\s+.*?)?$/)
  if (matches === null) return

  let match = matches[0]
  if (isBase) return match

  // Fix spacing that goes missing when provided by tailwindcss
  // Unfortunately this removes the ability to have classes on the same element
  // eg: .something.something or &.something
  match = match.replace(/(?<=\w)\./g, ' .')

  // If there's no spaces in the selector then
  if (!match.includes(' ')) return match

  // Look for class matching candidates
  const match2 = match.match(/(?<=>|~|\+|\*| )\.[\w.\\-]+(?= |>|~|\+|\*|:|$)/gm)
  if (!match2) return match

  // Wrap the matching classes in {{class}}
  for (const item of match2) {
    match = replaceSelectorWithParent(match, item)
  }

  return match
}

const parseRuleProperty = string => {
  if (string && string.match(/^--[a-z-]*$/i)) {
    return string
  }

  return camelize(string)
}

const escapeSelector = selector => selector.replace(/\\\//g, '/').trim()

const buildAtSelector = (name, values, screens) => {
  // Support @screen selectors
  if (name === 'screen') {
    const screenValue = screens[values]
    if (screenValue) return `@media (min-width: ${screenValue})`
  }

  return `@${name} ${values}`
}

const getBuiltRules = (rule, { isBase }) => {
  // Prep comma spaced selectors for parsing
  const selectorArray = rule.selector.split(',')

  // Validate each selector
  const selectorParsed = selectorArray
    .map(s => parseSelector(s, { isBase }))
    .filter(Boolean)

  // Join them back into a string
  const selector = selectorParsed.join(',')

  // Rule isn't formatted correctly
  if (!selector) return null

  if (isBase) {
    // Base values stay as-is because they aren't interactive
    return { [escapeSelector(selector)]: buildDeclaration(rule.nodes) }
  }

  // Separate comma-separated selectors to allow twin's features
  return selector.split(',').reduce(
    (result, selector) => ({
      ...result,
      [escapeSelector(selector)]: buildDeclaration(rule.nodes),
    }),
    {}
  )
}

const buildDeclaration = items => {
  if (typeof items !== 'object') return items
  return Object.entries(items).reduce(
    (result, [, declaration]) => ({
      ...result,
      [parseRuleProperty(declaration.prop)]: declaration.value,
    }),
    {}
  )
}

const getUserPluginRules = (rules, screens, isBase) =>
  rules.reduce((result, rule) => {
    // Build the media queries
    if (rule.type === 'atrule') {
      // Remove a bunch of nodes that tailwind uses for limiting rule generation
      // https://github.com/tailwindlabs/tailwindcss/commit/b69e46cc1b32608d779dad35121077b48089485d#diff-808341f38c6f7093a7979961a53f5922R20
      if (['layer', 'variants', 'responsive'].includes(rule.name)) {
        return deepMerge(
          result,
          ...getUserPluginRules(rule.nodes, screens, isBase)
        )
      }

      const atSelector = buildAtSelector(rule.name, rule.params, screens)

      return deepMerge(result, {
        [atSelector]: getUserPluginRules(rule.nodes, screens, isBase),
      })
    }

    const builtRules = getBuiltRules(rule, { isBase })

    return deepMerge(result, builtRules)
  }, {})

const getUserPluginData = ({ config }) => {
  if (!config.plugins || config.plugins.length === 0) {
    return
  }

  // Use Tailwind (using PostCss) to process the plugin data
  const processedPlugins = processPlugins(config.plugins, config)

  /**
   * Variants
   */
  // No support for Tailwind's addVariant() function

  /**
   * Base
   */
  const base = getUserPluginRules(
    processedPlugins.base,
    config.theme.screens,
    true
  )

  /**
   * Components
   */
  const components = getUserPluginRules(
    processedPlugins.components,
    config.theme.screens
  )

  /**
   * Utilities
   */
  const utilities = getUserPluginRules(
    processedPlugins.utilities,
    config.theme.screens
  )

  return { base, components, utilities }
}

export default getUserPluginData
