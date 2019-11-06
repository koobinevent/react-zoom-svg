import { configure, addDecorator } from '@storybook/react'

import { withKnobs } from '@storybook/addon-knobs'

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /\.stories\.js$/)
function loadStories() {
  req.keys().forEach(filename => req(filename))
}

configure(loadStories, module)

// Add decorators for all stories
addDecorator(withKnobs)
