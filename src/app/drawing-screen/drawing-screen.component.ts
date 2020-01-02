import { Component, OnInit, HostListener, OnDestroy } from '@angular/core'
import { Path, Point } from '../picture.service'
import { Router, ActivatedRoute } from '@angular/router'
import { DrawingService } from '../drawing.service'
import { Subscription } from 'rxjs'
import { Tool } from '../tool-bar/tool-bar.component'
import { TitleAdapterService } from '../title-adapter.service'

@Component({
  selector: 'app-drawing-screen',
  templateUrl: './drawing-screen.component.html',
  styleUrls: ['./drawing-screen.component.scss']
})
export class DrawingScreenComponent implements OnInit, OnDestroy {
  pictureId: string | null = null

  selectedTool: Tool = 'pen'

  palmRejectionEnabled = false

  private subscription = new Subscription()

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private drawingService: DrawingService,
    private titleAdapterService: TitleAdapterService
  ) {}

  ngOnInit() {
    this.drawingService.clean()

    const pictureId = this.activatedRoute.snapshot.params.pictureId
    if (typeof pictureId === 'string') {
      this.pictureId = pictureId
      this.drawingService.loadPicture(pictureId).then(() => {
        this.titleAdapterService.title.next(this.title)
      })
    } else {
      this.drawingService.init()
      this.titleAdapterService.title.next(this.title)
    }

    this.subscription.add(
      this.drawingService.onSave.subscribe(({ pictureId }) => {
        if (pictureId !== this.pictureId) {
          this.router.navigateByUrl(`/p/${pictureId}`)
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  get title() {
    const { picture } = this.drawingService
    return picture != null ? picture.title : ''
  }

  set title(title: string) {
    this.drawingService.setTitle(title)
    this.titleAdapterService.title.next(title)
  }

  get paths() {
    const { picture } = this.drawingService
    return picture != null ? picture.paths : []
  }

  onMouseDown(event: MouseEvent) {
    switch (this.selectedTool) {
      case 'pen':
        this.drawingService.handlePenDown({
          color: '#000',
          width: 3,
          ...getXYFromMouseEvent(event)
        })
        break

      case 'eraser':
        this.drawingService.handleEraserDown(getXYFromMouseEvent(event))
        break
    }
  }

  onMouseMove(event: MouseEvent) {
    switch (this.selectedTool) {
      case 'pen':
        this.drawingService.handlePenMove(getXYFromMouseEvent(event))
        break

      case 'eraser':
        this.drawingService.handleEraserMove(getXYFromMouseEvent(event))
        break
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUpGlobal(event: MouseEvent) {
    switch (this.selectedTool) {
      case 'pen':
        this.drawingService.handlePenUp()
        break

      case 'eraser':
        this.drawingService.handleEraserUp()
        break
    }
  }

  onTouchStart(event: TouchEvent) {
    switch (this.selectedTool) {
      case 'pen': {
        const xy = getXYFromTouchEvent(event, this.palmRejectionEnabled)
        if (xy == null) break
        event.preventDefault()
        this.drawingService.handlePenDown({
          color: '#000',
          width: 3,
          ...xy
        })
        break
      }

      case 'eraser': {
        const xy = getXYFromTouchEvent(event, this.palmRejectionEnabled)
        if (xy == null) break
        event.preventDefault()
        this.drawingService.handleEraserDown(xy)
        break
      }
    }
  }

  onTouchMove(event: TouchEvent) {
    switch (this.selectedTool) {
      case 'pen': {
        const xy = getXYFromTouchEvent(event, this.palmRejectionEnabled)
        if (xy == null) break
        event.preventDefault()
        this.drawingService.handlePenMove(xy)
        break
      }

      case 'eraser': {
        const xy = getXYFromTouchEvent(event, this.palmRejectionEnabled)
        if (xy == null) break
        event.preventDefault()
        this.drawingService.handleEraserMove(xy)
        break
      }
    }
  }

  onTouchEnd(event: TouchEvent) {
    switch (this.selectedTool) {
      case 'pen':
        if (getTouch(event, this.palmRejectionEnabled) != null) {
          event.preventDefault()
          this.drawingService.handlePenUp()
        }
        break

      case 'eraser':
        if (getTouch(event, this.palmRejectionEnabled) != null) {
          event.preventDefault()
          this.drawingService.handleEraserUp()
        }
        break
    }
  }

  getPathDescriptor(path: Path): string {
    return path.points
      .map(({ x, y }, i) => {
        if (i === 0) {
          return `M ${x},${y}`
        } else {
          return `L ${x},${y}`
        }
      })
      .join(' ')
  }
}

function getXYFromMouseEvent(event: MouseEvent): Point {
  return { x: event.offsetX, y: event.offsetY }
}

function getXYFromTouchEvent(event: TouchEvent, palmRejection: boolean): Point | null {
  const rect = (event.target as Element).getBoundingClientRect()
  const touch = getTouch(event, palmRejection)
  if (touch == null) return null
  const x = touch.clientX - window.pageXOffset - rect.left
  const y = touch.clientY - window.pageYOffset - rect.top
  return { x, y }
}

function getTouch(event: TouchEvent, palmRejection: boolean): Touch | null {
  if (!palmRejection) {
    return event.changedTouches[0]
  }

  for (const changedTouch of Array.from(event.changedTouches)) {
    if (changedTouch.touchType === 'stylus') {
      return changedTouch
    }
  }
  return null
}
