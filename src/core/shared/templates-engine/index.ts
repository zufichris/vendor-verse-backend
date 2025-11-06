import path from "path"
import { env } from "../../../config"
import fs from 'fs'
import handlebars from "handlebars"

export class TemplatesEngine {
    private static readonly baseDir: string = path.join(env.cwd, 'src', 'core', 'templates')

    public static isInit: boolean = false

    public static init() {
        const partialsDir = path.join(this.baseDir, 'partials')
        fs.readdirSync(partialsDir).forEach((filename) => {
            const matches = /^([^.]+).hbs$/.exec(filename);
            if (matches) {
                const name = matches[1];
                const template = fs.readFileSync(path.join(partialsDir, filename), "utf8");
                handlebars.registerPartial(name, template);
            }
        });

        this.isInit = true
    }

    public static compile<T extends Record<string, unknown>>(templatePath: string, args: T, layout = 'main') {
        if (!this.isInit) {
            this.init()
        }

        const now = new Date()

        const params = {
            ...args,
            year: now.getFullYear(),
        }

        const sourcePath = path.join(this.baseDir, templatePath)

        const source = fs.readFileSync(sourcePath, 'utf-8')

        const template = handlebars.compile(source)

        const html = template(params)

        if (layout) {
            const mainPath = path.join(this.baseDir, 'layouts', `${layout}.hbs`)

            const layoutSource = fs.readFileSync(mainPath, 'utf-8')

            const mainTemplate = handlebars.compile(layoutSource)

            const mainHtml = mainTemplate({
                ...params,
                body: html
            })

            return mainHtml
        }

        return html;
    }
}