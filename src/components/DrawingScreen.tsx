import React, { useEffect, useState, useMemo, useLayoutEffect } from 'react'
import { ToolBar } from './ToolBar'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PictureService } from '../services/PictureService'
import { CanvasManager } from '../CanvasManager'
import { Title } from './Title'

type Props = {}

const defaultTitle = 'Untitled'

export function DrawingScreen({}: Props) {
  const { pictureId } = useParams<{ pictureId: string }>()
  const pictureService = PictureService.instantiate()

  const canvasManager = useMemo(() => new CanvasManager(pictureId), [pictureId])

  const [title, setTitle] = useState<string | null>(null)

  useLayoutEffect(() => {
    return () => {
      canvasManager.cleanup()
    }
  }, [canvasManager])

  useEffect(() => {
    const unsubscribe = pictureService.watchPicture(
      pictureId,
      (picture) => {
        setTitle(picture?.title ?? null)
      },
      { includesLocalChanges: true }
    )

    const unsubscribePermission = pictureService.watchPermission(pictureId, (permission) => {
      canvasManager.setWritable(permission.writable)
    })

    return () => {
      unsubscribe()
      unsubscribePermission()
    }
  }, [pictureService, pictureId, canvasManager])

  return (
    <>
      <Title>{title ?? defaultTitle}</Title>
      <Container>
        <ToolBar pictureId={pictureId} canvasManager={canvasManager} />
        <div className="canvas-wrapper">
          <canvas ref={canvasManager.canvasRef}></canvas>
        </div>
      </Container>
    </>
  )
}

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;

  > .canvas-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
`
