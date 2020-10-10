import Filter from 'bad-words'

const filter = new Filter()

// self explanatory
filter.addWords(
  'elerium',
  'astral',
  'pay',
  'pays',
  'privateugc',
  'wizardugc',
  'filepush',
  'fp'
)

export default filter
