import { BrowserContext } from "puppeteer";
import { getBrowser } from "./puppeteer";

export default class ContextPool {
    private static pool: BrowserContext[] = [];
    private static creating = 0;
    private static readonly MIN_SIZE = 2;
    private static readonly MAX_SIZE = 5;

    static async get() {
        if (this.pool.length > 0) return this.pool.pop()!;

        const browser = await getBrowser();
        const context = await browser.createBrowserContext();
        this.refill();
        return context;
    }

    static async return(context: BrowserContext) {
        if (this.pool.length < this.MAX_SIZE) {
            context.deleteCookie(...(await context.cookies()));
            this.pool.push(context);
        } else {
            context.close();
        }
    }

    private static refill() {
        if (this.pool.length < this.MIN_SIZE && this.creating === 0) {
            this.creating++;
            getBrowser()
                .then((browser) => browser.createBrowserContext())
                .then((context) => {
                    this.pool.push(context);
                    this.creating--;
                    this.refill();
                });
        }
    }
}
