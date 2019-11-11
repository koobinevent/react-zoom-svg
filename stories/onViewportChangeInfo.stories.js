import React, { useState } from 'react'
import { identity } from 'transformation-matrix'

import { storiesOf } from '@storybook/react'
import { object, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'

import worldMapImage from '../static/square.svg'

import Interaction from '../src'

const Demo = ({ zoomLimits, panLimits, disableZoom, disablePan, onClick }) => {
  const [viewportMatrix, setViewportMatrix] = useState(identity())
  const [interactionType, setInteractionType] = useState(undefined)

  const handleViewportInteraction = ({ matrix, type }) => {
    setViewportMatrix(matrix)
    setInteractionType(type)
  }

  return (
    <>
      <div
        style={{
          width: '50vw',
          height: '50vh',
          borderStyle: 'solid',
          borderWidth: '10px',
          borderColor: 'lightgrey'
        }}
      >
        <Interaction
          zoomLimits={zoomLimits}
          panLimits={panLimits}
          disableZoom={disableZoom}
          disablePan={disablePan}
          viewportMatrix={viewportMatrix}
          onViewportInteraction={handleViewportInteraction}
          onClick={onClick}
        >
          <image
            xlinkHref={worldMapImage}
            width='100%'
            height='100%'
          />
        </Interaction>
      </div>
      <div
        style={{
          userSelect: 'none'
        }}
      >
        Last interaction type: {interactionType}
      </div>
    </>
  )
}

storiesOf('react-interaction', module)
  .add('onViewportChange Interaction type', () => {

    const disableZoom = boolean('disableZoom', false)
    const disablePan = boolean('disablePan', false)

    const zoomLimits = object(
      'zoomLimits',
      {
        min: 0.1,
        max: 6
      }
    )

    const panLimits = boolean(
      'panLimits',
      false
    )

    const onClickAction = action('Click event handler')

    return (
      <Demo
        zoomLimits={zoomLimits}
        panLimits={panLimits}
        disableZoom={disableZoom}
        disablePan={disablePan}
        onClick={onClickAction}
      />
    )
  })
