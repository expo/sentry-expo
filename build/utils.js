export function overrideDefaultIntegrations(defaults, overrides) {
    const overrideIntegrationNames = overrides.map((each) => each.name);
    const result = [];
    defaults.forEach((each) => {
        if (!overrideIntegrationNames.includes(each.name)) {
            result.push(each);
        }
    });
    return [...result, ...overrides];
}
//# sourceMappingURL=utils.js.map