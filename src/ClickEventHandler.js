import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import isCallable from 'is-callable'
import deepEqual from 'react-fast-compare'

function ClickEventHandler ({
  onClickEvent,
  children
}) {
  const touchesCountRef = useRef(0)
  const isClickAllowedRef = useRef(false)
  const startPositionRef = useRef(null)

  /**
   * Returns `true` if one single finger triggered the `touchEvent` and no
   * fingers where touching the screen before. Returns `false` otherwhise.
   *
   * @param {TouchEvent} touchEvent
   */
  const isSingleFingerTap = touchEvent => {
    return touchEvent.touches.length === 1 && touchesCountRef.current === 0
  }

  const handleTouchStart = e => {
    if (isSingleFingerTap(e)) {
      const { clientX, clientY } = e.touches[0]
      startPositionRef.current = {
        x: clientX,
        y: clientY
      }
      isClickAllowedRef.current = true
    } else {
      isClickAllowedRef.current = false
    }

    touchesCountRef.current += e.touches.length - touchesCountRef.current
  }

  const handleTouchMove = e => {
    if (isClickAllowedRef.current) {
      const { clientX, clientY } = e.touches[0]
      const targetPoint = {
        x: clientX,
        y: clientY
      }
      if (!deepEqual(startPositionRef.current, targetPoint)) {
        isClickAllowedRef.current = false
      }
    } else {
      isClickAllowedRef.current = false
    }
  }

  const handleTouchEnd = e => {
    if (isClickAllowedRef.current) {
      onClickEvent(e)
    }

    startPositionRef.current = null
    isClickAllowedRef.current = false
    touchesCountRef.current = e.touches.length
  }

  const handleMouseDown = () => {
    isClickAllowedRef.current = true
  }

  const handleMouseMove = () => {
    isClickAllowedRef.current = false
  }

  const handleMouseUp = e => {
    if (isClickAllowedRef.current) {
      onClickEvent(e)
    }
    isClickAllowedRef.current = false
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {children}
    </div>
  )
}

ClickEventHandler.propTypes = {
  children: PropTypes.node,
  onSectionClick: PropTypes.func,
  onSectionHover: PropTypes.func,
  onSeatClick: PropTypes.func,
  onSeatHover: PropTypes.func
}

export default ClickEventHandler
