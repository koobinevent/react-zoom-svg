import React, { useState } from 'react'
import { identity } from 'transformation-matrix'

import { storiesOf } from '@storybook/react'
import { text, object, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import worldMapImage from '../static/world-map.svg'

import Interaction from '../src'

const Demo = ({ viewSize, zoomLimits, disableZoom, disablePan, onClick }) => {
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
        viewSize={viewSize}
        zoomLimits={zoomLimits}
        disableZoom={disableZoom}
        disablePan={disablePan}
        viewportMatrix={viewportMatrix}
        onViewportInteraction={setViewportMatrix}
        onClick={onClick}
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

    const viewSize = object(
      'viewSize',
      {
        width: 100,
        height: 100
      }
    )

    const zoomLimits = object(
      'zoomLimits',
      {
        min: 1,
        max: 6
      }
    )

    const disableZoom = boolean('disableZoom', false)
    const disablePan = boolean('disablePan', false)

    const onClickAction = action('Click event handler')

    return (
      <Demo
        viewSize={viewSize}
        zoomLimits={zoomLimits}
        disableZoom={disableZoom}
        disablePan={disablePan}
        onClick={onClickAction}
      />
    )
  })
