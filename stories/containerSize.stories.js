import React, { useState, useEffect, useRef } from 'react'
import { identity } from 'transformation-matrix'

import { storiesOf } from '@storybook/react'
import { object, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import worldMapImage from '../static/square.svg'

import Interaction from '../src'

const Demo = ({ containerSize, zoomLimits, disableZoom, disablePan, onClick }) => {
  const [viewportMatrix, setViewportMatrix] = useState(identity())

  const [panLimits, setPanLimits] = useState(true)

  useEffect(() => {
    let limits = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }

    const aspectRatio = containerSize.height / containerSize.width
    if (aspectRatio > 1) {
      const ratioCorrection = (aspectRatio - 1) * 50
      limits.top = ratioCorrection
      limits.bottom = ratioCorrection
    } else {
      const ratioCorrection = (Math.pow(aspectRatio, -1) - 1) * 50
      limits.left = ratioCorrection
      limits.right = ratioCorrection
    }
    setPanLimits(limits)
  }, [containerSize])

  return (
    <div
      style={{
        width: `${containerSize.width}px`,
        height: `${containerSize.height}px`,
        borderStyle: 'solid',
        borderWidth: '10px',
        borderColor: 'lightgrey',
      }}
    >
      <Interaction
        zoomLimits={zoomLimits}
        panLimits={panLimits}
        disableZoom={disableZoom}
        disablePan={disablePan}
        viewportMatrix={viewportMatrix}
        onViewportInteraction={({ matrix }) => setViewportMatrix(matrix)}
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

storiesOf('react-interaction', module)
  .add('containerSize', () => {

    const containerSize = object(
      'containerSize',
      {
        width: 320,
        height: 180
      }
    )

    const disableZoom = boolean('disableZoom', false)
    const disablePan = boolean('disablePan', false)

    const zoomLimits = object(
      'zoomLimits',
      {
        min: 0.1,
        max: 6
      }
    )

    const onClickAction = action('Click event handler')

    return (
      <Demo
        containerSize={containerSize}
        zoomLimits={zoomLimits}
        disableZoom={disableZoom}
        disablePan={disablePan}
        onClick={onClickAction}
      />
    )
  })
