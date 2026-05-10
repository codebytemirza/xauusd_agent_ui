import { 
    ISeriesPrimitive, 
    ISeriesPrimitivePaneView, 
    ISeriesPrimitivePaneRenderer, 
    Coordinate, 
    Time 
} from 'lightweight-charts';

class BoxPaneRenderer implements ISeriesPrimitivePaneRenderer {
    _p1: Coordinate | null = null;
    _p2: Coordinate | null = null;
    _x1: Coordinate | null = null;
    _x2: Coordinate | null = null;
    _color: string = '';
    _borderColor: string = '';
    _opacity: number = 0.5;

    update(p1: Coordinate|null, p2: Coordinate|null, x1: Coordinate|null, x2: Coordinate|null, color: string, borderColor: string, opacity: number) {
        this._p1 = p1;
        this._p2 = p2;
        this._x1 = x1;
        this._x2 = x2;
        this._color = color;
        this._borderColor = borderColor;
        this._opacity = opacity;
    }

    draw(target: any) {
        if (this._p1 === null || this._p2 === null || this._x1 === null || this._x2 === null) return;
        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            const x = Math.min(this._x1!, this._x2!) * scope.horizontalPixelRatio;
            const y = Math.min(this._p1!, this._p2!) * scope.verticalPixelRatio;
            const w = Math.abs(this._x1! - this._x2!) * scope.horizontalPixelRatio;
            const h = Math.abs(this._p1! - this._p2!) * scope.verticalPixelRatio;

            ctx.globalAlpha = this._opacity;
            ctx.fillStyle = this._color;
            ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));

            if (this._borderColor) {
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = this._borderColor;
                ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 2); // Top Border
                ctx.fillRect(Math.round(x), Math.round(y + h - 2), Math.round(w), 2); // Bottom Border
            }
        });
    }
}

class BoxPaneView implements ISeriesPrimitivePaneView {
    _source: BoxPrimitive;
    _renderer = new BoxPaneRenderer();

    constructor(source: BoxPrimitive) {
        this._source = source;
    }

    zOrder(): "normal" | "bottom" | "top" {
        return 'bottom'; // Render behind candles
    }

    update() {
        const series = this._source.series;
        const timeScale = this._source.chart?.timeScale();
        if (!series || !timeScale) return;
        
        const p1 = series.priceToCoordinate(this._source.options.price1);
        const p2 = series.priceToCoordinate(this._source.options.price2);
        
        let x1 = timeScale.timeToCoordinate(this._source.options.time1);
        let x2: Coordinate | null = null;
        
        if (this._source.options.time2) {
            x2 = timeScale.timeToCoordinate(this._source.options.time2);
        }
        
        if (x2 === null && timeScale.width) {
             x2 = (timeScale.width() + 100) as Coordinate; 
        }
        
        if (x1 === null && timeScale.width) {
            x1 = -100 as Coordinate;
        }

        this._renderer.update(p1, p2, x1, x2, this._source.options.color, this._source.options.borderColor || '', this._source.options.opacity ?? 0.5);
    }

    renderer() {
        return this._renderer;
    }
}

export interface BoxOptions {
    time1: Time;
    time2?: Time;
    price1: number;
    price2: number;
    color: string;
    borderColor?: string;
    opacity?: number;
}

export class BoxPrimitive implements ISeriesPrimitive<Time> {
    options: BoxOptions;
    chart?: any;
    series?: any;
    _paneViews: BoxPaneView[];

    constructor(options: BoxOptions) {
        this.options = options;
        this._paneViews = [new BoxPaneView(this)];
    }
    
    attached(param: any) {
        this.chart = param.chart;
        this.series = param.series;
        this.requestUpdate();
    }

    detached() {
        this.chart = undefined;
        this.series = undefined;
    }

    paneViews() {
        return this._paneViews;
    }

    updateAllViews() {
        this._paneViews.forEach(v => v.update());
    }

    requestUpdate() {
        if (this.chart) this.chart.timeScale().subscribeVisibleTimeRangeChange(() => this.updateAllViews());
        this.updateAllViews();
        if (this.chart) this.chart.applyOptions({}); // trigger re-render
    }
}
