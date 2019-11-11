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
  zoomLimits,
  panLimits,
  disableZoom,
  disablePan,
  viewportMatrix,
  onViewportInteraction,
  onClick,
  children,
  ...rest
}, ref) => {
  const mapLimits = useRef({
    minX: 0,
    minY: 0,
    maxX: 100,
    maxY: 100
  })
  const limits = useRef(mapLimits.current)
  const initialPanningPoint = useRef(null)
  const lastDistance = useRef(null)

  const updateViewportMatrix = useCallback((newViewportMatrix, type) => {
    onViewportInteraction instanceof Function &&
      onViewportInteraction({
        matrix: newViewportMatrix,
        type
      })
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

  useEffect(() => {
    if (panLimits) {
      const mapL = mapLimits.current
      let panL = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
      if (typeof panLimits === 'number') {
        panL = {
          top: panLimits,
          right: panLimits,
          bottom: panLimits,
          left: panLimits
        }
      } else if (typeof panLimits === 'object') {
        panL = panLimits
      }
      limits.current = {
        minX: mapL.minX - panL.left,
        minY: mapL.minY - panL.top,
        maxX: mapL.maxX + panL.right,
        maxY: mapL.maxY + panL.bottom
      }
    }
  }, [panLimits])

  const applyZoom = (zoomPivot, scaleFactor) => {
    const newViewportMatrix = zoom(
      viewportMatrix,
      zoomPivot,
      scaleFactor,
      zoomLimits,
      mapLimits.current,
      panLimits ? limits.current : undefined // this are the limits
    )
    if (!deepEqual(viewportMatrix, newViewportMatrix)) {
      updateViewportMatrix(newViewportMatrix, 'zoom')
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
      mapLimits.current,
      panLimits ? limits.current : undefined // this are the limits
    )

    if (!deepEqual(viewportMatrix, newViewportMatrix)) {
      // Apply pan
      updateViewportMatrix(newViewportMatrix, 'pan')

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
          ${mapLimits.current.minX}
          ${mapLimits.current.minY}
          ${mapLimits.current.maxX}
          ${mapLimits.current.maxY}
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
  panLimits: false,
  disableZoom: false,
  disablePan: false
}

InteractionLayer.propTypes = {
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
  panLimits: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.exact({
      top: PropTypes.number,
      right: PropTypes.number,
      bottom: PropTypes.number,
      left: PropTypes.number
    })
  ]),
  disableZoom: PropTypes.bool,
  disablePan: PropTypes.bool,
  onViewportInteraction: PropTypes.func,
  children: PropTypes.node
}

export default InteractionLayer
