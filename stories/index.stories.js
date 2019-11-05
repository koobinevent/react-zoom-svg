import React, { useState } from 'react'
import { identity } from 'transformation-matrix'

import { storiesOf } from '@storybook/react'

import worldMapImage from '../static/world-map.svg'

import Interaction from '../src'

const Demo = props => {
  const [viewportMatrix, setViewportMatrix] = useState(identity())

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'white'
      }}
    >
      <Interaction
        viewSize={{ width: 100, height: 100 }}
        viewportMatrix={viewportMatrix}
        onViewportInteraction={setViewportMatrix}
      >
        <image
          xlinkHref={worldMapImage}
          width='100%'
          height='100%'
        />
      </Interaction>
    </div>
  )
}

storiesOf('Koobin', module)
  .add('react-interaction', () => {
    return <Demo />
  })
