const { NODE_ENV } = process.env

const isProduction = NODE_ENV === 'production'

module.exports = {
  presets: [
    [
      '@babel/env',
      { loose: true }
    ],
    '@babel/react'
  ],
  plugins: [
    'annotate-pure-calls',
    'preval',
    isProduction && 'transform-react-remove-prop-types',
    [
      '@babel/transform-runtime',
      { useESModules: true }
    ]
  ].filter(Boolean)
}
