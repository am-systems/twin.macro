import { throwIf, isShortCss } from './utils'
import { logBadGood } from './logging'

const precheckGroup = ({ classNameRaw }) =>
  throwIf(
    classNameRaw === 'group',
    () =>
      `\n\n"group" must be added as className:${logBadGood(
        'tw`group`',
        '<div className="group">'
      )}\nRead more at https://twinredirect.page.link/group\n`
  )

const precheckPeer = ({ classNameRaw }) =>
  throwIf(
    classNameRaw === 'peer',
    () =>
      `\n\n"peer" must be added as className:${logBadGood(
        'tw`peer`',
        '<div className="peer">'
      )}\nRead more at https://twinredirect.page.link/peer\n`
  )

const joinWithNoDoubleHyphens = arr => arr.join('-').replace(/-+/g, '-')

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const preCheckPrefix = ({ pieces: { className, hasPrefix }, state }) => {
  if (isShortCss(className)) return

  const { prefix } = state.config
  if (hasPrefix === Boolean(prefix)) return

  const classSuggestion = joinWithNoDoubleHyphens([prefix, className])

  throwIf(
    !className.startsWith(prefix),
    () =>
      `\n\n“${className}” should have a prefix:${logBadGood(
        className,
        classSuggestion
      )}`
  )
}

const preCheckNoHyphenSuffix = ({ pieces: { className, classNameRaw } }) => {
  if (isShortCss(className)) return

  throwIf(classNameRaw.endsWith('-'), () =>
    logBadGood(
      `“${className}” should not have a '-' suffix`,
      `Change it to “${className.replace(/-*$/, '')}”`
    )
  )
}

const doPrechecks = (prechecks, context) => {
  for (const precheck of prechecks) {
    precheck(context)
  }
}

export {
  doPrechecks as default,
  precheckGroup,
  precheckPeer,
  /* preCheckPrefix, */
  preCheckNoHyphenSuffix,
}
