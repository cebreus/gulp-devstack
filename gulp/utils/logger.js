import winston from 'winston'

/**
 * Determines the character to use for the log level's padding bars.
 * @param {string} level - The raw log level (e.g., 'error', 'info').
 * @returns {string} The character ('█', '▒', or '░').
 */
function getBarChar(level) {
  if (level === 'error' || level === 'warn') {
    return '█'
  } else if (level === 'info') {
    return '▒'
  } else {
    return '░'
  }
}

/**
 * Creates and returns a configured Winston logger instance.
 * @returns {winston.Logger} The configured Winston logger.
 */
export function createLogger() {
  const logLevel = process.env.LOG_LEVEL || 'debug'
  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss',
      }),
      winston.format.printf((info) => {
        const { level: coloredLevelString, message } = info

        // eslint-disable-next-line no-control-regex
        const colorMatch = coloredLevelString.match(/(\x1b\[[0-9;]*m)(.*?)(\x1b\[[0-9;]*m)/)

        let rawLevel = coloredLevelString // Default to colored string if no match
        let startColor = ''
        let endColor = ''

        if (colorMatch) {
          startColor = colorMatch[1]
          rawLevel = colorMatch[2]
          endColor = colorMatch[3]
        }

        const upperCaseLevel = rawLevel.toUpperCase()
        const barChar = getBarChar(rawLevel)

        const numBars = Math.max(0, 7 - upperCaseLevel.length)
        const bars = barChar.repeat(numBars)

        // Construct the final colored prefix string
        const finalPrefix = `${startColor}${barChar} ${upperCaseLevel} ${bars}${endColor}`

        return `${finalPrefix} ${message}`
      })
    ),
    transports: [new winston.transports.Console()],
  })
}

export default createLogger()
