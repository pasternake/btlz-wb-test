type AsyncTask = () => Promise<void>;

export interface SchedulerTasks {
    refreshPipeline: AsyncTask;
    cleanupRawFiles: AsyncTask;
    cleanupRawSnapshots: AsyncTask;
    pruneTariffsBox: AsyncTask;
}

export interface SchedulerOptions {
    refreshIntervalMs: number;
    retentionIntervalMs: number;
    logger?: Console;
}

export interface SchedulerController {
    stop: () => void;
}

export function startSchedulers(tasks: SchedulerTasks, options: SchedulerOptions): SchedulerController {
    const logger = options.logger ?? console;
    const handles: NodeJS.Timeout[] = [];

    handles.push(setInterval(createRunner("refreshPipeline", tasks.refreshPipeline, logger), options.refreshIntervalMs));
    handles.push(setInterval(createRunner("cleanupRawFiles", tasks.cleanupRawFiles, logger), options.retentionIntervalMs));
    handles.push(setInterval(createRunner("cleanupRawSnapshots", tasks.cleanupRawSnapshots, logger), options.retentionIntervalMs));
    handles.push(setInterval(createRunner("pruneTariffsBox", tasks.pruneTariffsBox, logger), options.retentionIntervalMs));

    return {
        stop: () => {
            for (const handle of handles) {
                clearInterval(handle);
            }
        },
    };
}

function createRunner(name: string, task: AsyncTask, logger: Console) {
    let active = false;
    return async () => {
        if (active) {
            logger.warn(`[scheduler] Task ${name} skipped because previous run still active`);
            return;
        }
        active = true;
        try {
            await task();
        } catch (error) {
            logger.error(`[scheduler] Task ${name} failed`, error);
        } finally {
            active = false;
        }
    };
}
