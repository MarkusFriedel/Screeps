class TraceResult {
    usedCpu: number = 0;
    startCPU: number = 0;
    count: number = 0;
    name: string;

    public stop() {
        this.usedCpu += (Game.cpu.getUsed() - this.startCPU);
        this.count++;
    }
}

class Tracer {
    private results: { [name: string]: TraceResult } = {};

    constructor(public name: string) { };

    public start(name: string) {
        let traceResult = this.results[name];
        if (traceResult == null) {
            traceResult = new TraceResult();
            traceResult.name = name;
            this.results[name] = traceResult;
        }
        traceResult.startCPU = Game.cpu.getUsed();
        
        return traceResult;
    }

    public print() {
        if (Memory['tracer'] == true || Memory['tracer'] == 'true') {
            console.log();
            for (let i in this.results) {
                let result = this.results[i];
                console.log('Trace CPU Used: ' + result.usedCpu.toFixed(2) + ' Count: ' + result.count + ': ' + this.name + ': ' + result.name);
            }
        }
    }
    public reset() {
        this.results = {};
    }
}