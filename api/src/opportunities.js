const { z } = require("zod");
const rules = require("../../shared/opportunities.mjs");

const submission = z.object({
  convocatoriaId: z.string().uuid(),
  responses: z.record(z.string(), z.union([z.boolean(), z.number()])),
});

module.exports = {
  ...rules,
  evaluateOpportunity(body) {
    const result = rules.evaluateOpportunity(submission.parse(body));
    if (result.field)
      throw new z.ZodError([
        {
          code: "custom",
          path: ["responses", result.field],
          message: result.error,
        },
      ]);
    return result;
  },
};
