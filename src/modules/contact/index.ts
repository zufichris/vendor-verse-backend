import { initContactRoutes } from "./contact.routes";
import { ContactsController } from "./controllers";
import { ContactService } from "./services";

export function initContactUsModule() {
    const ctrl = new ContactsController(new ContactService())

    return initContactRoutes(ctrl)
}