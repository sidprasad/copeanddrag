import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore/lite';
const execSync = require('child_process').execSync;


// Enum for log levels
export enum LogLevel {
    INFO = "info",
    DEBUG = "debug",
    WARNING = "warning",
    ERROR = "error"
}

// Add this to the logging
export enum Event {
    ASSISTANCE_REQUEST = "assistance_request",
    CONCEPTUAL_MUTANT = "conceptual_mutant",
    THOROUGHNESS_MUTANT = "thoroughness_mutant",
    HALP_RESULT = "halp_result",
    FORGE_RUN_RESULT = "forge_run_result",
    FORGE_RUN = "forge_run",
    FILE_DOWNLOAD = "file_download",
    AMBIGUOUS_TEST =   "ambiguous_test",
    CND_RUN = "cnd_run"
}

import config from "./logging_config.json";

export class Logger {

    app; db; log_target; version;

    // But what if logging is turned on and then off.
    // I don't want to manage that state.
    constructor(private user: string, private enabled: boolean, private cnd_version: string)
    {
        if(this.enabled)
        {
            this.app = initializeApp(config);
            this.db = getFirestore(this.app)
            this.log_target = collection(this.db, config.collectionName);
        }
    }
 
    payload(payload: any, loglevel: LogLevel, event: Event)
    {
        return {
            user: this.user,
            content: payload,
            timestamp: Date.now(),
            loglevel: loglevel,
            event : event
        }
    }

    async log_payload(payload: any, loglevel: LogLevel, event: Event) {
        let p = this.payload(payload, loglevel, event);
        let log = doc(this.log_target);

        let do_not_log = !this.enabled || process.env.NODE_ENV === 'development' || process.env.npm_lifecycle_event === 'dev';
        try {
            if (do_not_log) {
                console.log(p);
            } else {
                await setDoc(log, p);
            }
        } catch (error) {
            console.error("Log failure ", error);
        }
    }
  }