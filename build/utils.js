"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.overrideDefaultIntegrations = void 0;
function overrideDefaultIntegrations(defaults, overrides) {
    const overrideIntegrationNames = overrides.map((each) => each.name);
    const result = [];
    defaults.forEach((each) => {
        if (!overrideIntegrationNames.includes(each.name)) {
            result.push(each);
        }
    });
    return [...result, ...overrides];
}
exports.overrideDefaultIntegrations = overrideDefaultIntegrations;
//# sourceMappingURL=utils.js.map