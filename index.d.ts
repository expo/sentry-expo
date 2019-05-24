import * as Sentry from "@sentry/browser";

export default class SentryExpo extends Sentry {
  static enableInExpoDevelopment: boolean;
}
