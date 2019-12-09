import { Injectable, EventEmitter } from '@angular/core'
import { Picture, PictureService, Path } from './picture.service'
import { Subject } from 'rxjs'

type PenEvent = {
  x: number
  y: number
  color: string
  width: number
}

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  picture: Picture | null = null
  private currentlyDrawingPath: Path | null = null

  readonly onSave = new Subject<{ pictureId: string }>()

  constructor(private pictureService: PictureService) {}

  clean() {
    this.picture = null
    this.currentlyDrawingPath = null
  }

  async loadPicture(pictureId: string) {
    const picture = await this.pictureService.fetchPicture(pictureId)
    this.picture = picture
  }

  handlePenDown({ x, y, color, width }: PenEvent) {
    if (this.currentlyDrawingPath != null) {
      return
    }

    const { picture } = this
    if (picture != null) {
      const path: Path = { color, width, points: [{ x, y }] }
      picture.paths.push(path)
      this.currentlyDrawingPath = path
    }
  }

  handlePenMove({ x, y }: Pick<PenEvent, 'x' | 'y'>) {
    const { currentlyDrawingPath: path } = this
    if (path == null) return

    const len = path.points.length
    if (len != null) {
      const point = path.points[len - 1]
      if (point.x === x || point.y === y) {
        return
      }
    }

    path.points.push({ x, y })
  }

  handlePenUp() {
    this.currentlyDrawingPath = null
  }

  setTitle(title: string) {
    const { picture } = this
    if (picture != null) {
      picture.title = title
    }
  }

  async save() {
    const {picture} = this;
    if (picture==null) {
      return
    }

    const o = await this.pictureService.savePicture(picture)
    this.onSave.next(o)
  }
}