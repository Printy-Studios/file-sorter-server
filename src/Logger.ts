export type LogFilter = string[] | string | null | undefined

export default class Logger {

    static DEFAULT_TAG = 'info';

    enabled: boolean = true;
    prefix: string;
    filter: LogFilter = 'info';

    constructor(enabled: boolean = true, prefix: string = 'Log') {
        this.enabled = enabled;
        this.prefix = prefix;
    }

    log(args: any[] | any, tag: string = 'info') {
        if (this.enabled && Logger.filtersMatch(this.filter, tag)) {
            const prefixStr = Logger.makePrefixStr(this.prefix);
            const filterStr = Logger.makeFilterStr(tag);
            if(Array.isArray(args)) {
                console.log(prefixStr, ...args, filterStr);
            } else {
                console.log(prefixStr, args, filterStr);
            }
            
        }
    }

    static makeFilterStr(filter: string) {
        return '[' + filter + ']';
    }

    static makePrefixStr(prefix: string) {
        return prefix ? (prefix + ': ') : null;
    }

    static filtersMatch(filter1: LogFilter, filter2: LogFilter) {
        if (!filter1 && !filter1) {
            return true;
        } else if (!filter1 || !filter2) {
            return false;
        }
        if( Array.isArray(filter1) ) {
            if( Array.isArray(filter2) ) {
                return filter1.findIndex(type => filter2.includes(type)) > -1;
            } else {
                return filter1.includes(filter2);
            }
        } else if (Array.isArray(filter2)) {
            return filter2.includes(filter1);
        } else {
            return filter1 === filter2;
        }
    }

    trace(){
        if (this.enabled) {
            console.trace();
        }
    }
}