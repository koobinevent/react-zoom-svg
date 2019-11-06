import React, { useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import deepEqual from 'react-fast-compare'
import { ensuredForwardRef } from 'react-use'

import {
  toSVG,
  identity
} from 'transformation-matrix'

import ClickEventHandler from './ClickEventHandler'
import {
  getDistanceBetweenPoints,
  fromDomToScene,
  getMidpoint,
  zoom,
  pan
} from './utils'

const InteractionLayer = ensuredForwardRef(({
  viewSize,
  zoomLimits,
  disableZoom,
  disablePan,
  viewportMatrix,
  onViewportInteraction,
  onClick,
  children,
  ...rest
}, ref) => {
  const initialPanningPoint = useRef(null)
  const lastDistance = useRef(null)

  const updateViewportMatrix = useCallback(newViewportMatrix => {
    onViewportInteraction instanceof Function &&
      onViewportInteraction(newViewportMatrix)
  }, [onViewportInteraction])

  // Disable default behaviour of touch events to make the pinch and tap work in
  // iOS Safari.
  useEffect(() => {
    const svgElement = ref.current

    const preventDefault = e => {
      e.preventDefault()
    }

    svgElement.addEventListener('touchstart', preventDefault)
    svgElement.addEventListener('touchmove', preventDefault)

    return () => {
      svgElement.removeEventListener('touchstart', preventDefault)
      svgElement.removeEventListener('touchmove', preventDefault)
    }
  }, [ref])

  const applyZoom = (zoomPivot, scaleFactor) => {
    const newViewportMatrix = zoom(
      viewportMatrix,
      zoomPivot,
      scaleFactor,
      zoomLimits,
      viewSize,
      viewSize // this are the limits
    )
    if (!deepEqual(viewportMatrix, newViewportMatrix)) {
      updateViewportMatrix(newViewportMatrix)
    }
  }

  const applyPan = finalPanningPoint => {
    const originPoint = fromDomToScene(
      getSceneCTM(),
      initialPanningPoint.current
    )

    const targetPoint = fromDomToScene(
      getSceneCTM(),
      finalPanningPoint
    )

    const newViewportMatrix = pan(
      viewportMatrix,
      originPoint,
      targetPoint,
      viewSize,
      viewSize // this are the limits
    )

    if (!deepEqual(viewportMatrix, newViewportMatrix)) {
      // Apply pan
      updateViewportMatrix(newViewportMatrix)

      // Save the last panning point
      initialPanningPoint.current = finalPanningPoint
    }
  }

  const handleWheel = e => {
    if (!disableZoom) {
      const { deltaY, clientX, clientY } = e

      const zoomPivot = fromDomToScene(
        getSceneCTM(),
        {
          x: clientX,
          y: clientY
        }
      )

      const scaleFactor = deltaY * 0.01

      applyZoom(zoomPivot, scaleFactor)
    }
  }

  const handleMouseDown = e => {
    const { clientX, clientY } = e
    initialPanningPoint.current = {
      x: clientX,
      y: clientY
    }
  }

  const handleMouseMove = e => {
    if (initialPanningPoint.current && !disablePan) {
      const { clientX, clientY } = e
      const finalPanningPoint = { x: clientX, y: clientY }
      applyPan(finalPanningPoint)
    }
  }

  const handleTouchStart = e => {
    if (e.touches.length === 2) handlePinchStart(e)
    if (e.touches.length === 1) handleTapStart(e)
  }

  const handlePinchStart = e => {
    const { pointA, pointB } = getFirstTwoPointsFromEvent(e)
    lastDistance.current = getDistanceBetweenPoints(pointA, pointB)
  }

  const handleTapStart = e => {
    handleMouseDown(e.touches[0])
  }

  const handleTouchMove = e => {
    if (e.touches.length === 2 && !disableZoom) handlePinchMove(e)
    if (e.touches.length === 1) handlePanMove(e)
  }

  const handlePinchMove = e => {
    const { pointA, pointB } = getFirstTwoPointsFromEvent(e)
    const distance = getDistanceBetweenPoints(pointA, pointB)

    const zoomPivot = fromDomToScene(
      getSceneCTM(),
      getMidpoint(pointA, pointB)
    )

    const scaleFactor = distance / lastDistance.current - 1

    applyZoom(zoomPivot, scaleFactor)

    lastDistance.current = distance
  }

  const handlePanMove = e => {
    handleMouseMove(e.touches[0])
  }

  const stopPanning = () => {
    initialPanningPoint.current = null
  }

  const getSceneCTM = () => {
    return ref.current.getScreenCTM()
  }

  const getFirstTwoPointsFromEvent = e => {
    return {
      pointA: {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      },
      pointB: {
        x: e.touches[1].clientX,
        y: e.touches[1].clientY
      }
    }
  }

  return (
    <ClickEventHandler
      onClickEvent={onClick}
    >
      <svg
        {...rest}
        viewBox={`
          0
          0
          ${viewSize.width}
          ${viewSize.height}
        `}
        style={{
          touchAction: 'none',
          width: '100%',
          height: '100%'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopPanning}
        ref={ref}
      >
        <g transform={toSVG(viewportMatrix)}>
          {children}
        </g>
      </svg>
    </ClickEventHandler>
  )
})

InteractionLayer.defaultProps = {
  viewportMatrix: identity(),
  zoomLimits: {
    min: 1,
    max: 6
  },
  disableZoom: false,
  disablePan: false
}

InteractionLayer.propTypes = {
  viewSize: PropTypes.exact({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  viewportMatrix: PropTypes.exact({
    a: PropTypes.number,
    b: PropTypes.number,
    c: PropTypes.number,
    d: PropTypes.number,
    e: PropTypes.number,
    f: PropTypes.number
  }),
  zoomLimits: PropTypes.exact({
    min: PropTypes.number,
    max: PropTypes.number
  }),
  disableZoom: PropTypes.bool,
  disablePan: PropTypes.bool,
  onViewportInteraction: PropTypes.func,
  children: PropTypes.node
}

export default InteractionLayer
