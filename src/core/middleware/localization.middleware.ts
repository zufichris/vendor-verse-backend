import { ApiHandler } from "../../util/api-handler";

export type Locale = "en" | "fr" | "ar";

const Languages: { name: string; code: Locale }[] = [
  {
    name: "English",
    code: "en",
  },
];

export const localizationMiddleware = ApiHandler(async (req, _, next) => {
  const { locale } = req.params;

  req.locale =
    Languages.find((l) => l.code === (locale as string).toLowerCase())?.code ||
    "en";
  next();
});
