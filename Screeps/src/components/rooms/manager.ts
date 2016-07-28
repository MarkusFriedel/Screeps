abstract class Manager {


    constructor(protected tracer:Tracer) {

    }

    public preTick() {
        let trace = this.tracer.start('preTick()');
        this._preTick();
        trace.stop();
    }

    public _preTick() {

    }

    public tick() {
        let trace = this.tracer.start('tick()');
        this._tick();
        trace.stop();
    }

    public _tick() {

    }

    public postTick() {
        let trace = this.tracer.start('postTick()');
        this._postTick();
        trace.stop();
    }

    public _postTick() {

    }
}