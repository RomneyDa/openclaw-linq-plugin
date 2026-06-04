import { z } from "zod";

const e164PhoneSchema = z.string().regex(/^\+[1-9]\d{6,14}$/u, "expected E.164 phone number");
const allowFromEntrySchema = z.union([z.string().min(1), z.number()]);
const secretRefSchema = z.object({
  source: z.enum(["env", "file"]),
  provider: z.string().min(1).default("default"),
  id: z.string().min(1),
});

export const LinqAccountConfigSchema: z.ZodType<Record<string, unknown>> = z.lazy(() =>
  z
    .object({
      name: z.string().min(1).optional(),
      enabled: z.boolean().optional(),
      apiToken: z.union([z.string().min(1), secretRefSchema]).optional(),
      tokenFile: z.string().min(1).optional(),
      fromPhone: e164PhoneSchema.optional(),
      // TODO: default to "pairing" once durable Linq pairing setup is supported.
      dmPolicy: z.enum(["pairing", "open", "disabled"]).default("open").optional(),
      allowFrom: z.array(allowFromEntrySchema).optional(),
      groupPolicy: z.enum(["open", "allowlist", "disabled"]).default("disabled").optional(),
      groupAllowFrom: z.array(allowFromEntrySchema).optional(),
      mediaMaxMb: z.number().positive().max(100).default(10).optional(),
      textChunkLimit: z.number().int().positive().max(8000).default(4000).optional(),
      webhookUrl: z.string().url().optional(),
      webhookSecret: z.union([z.string().min(1), secretRefSchema]).optional(),
      webhookPath: z.string().regex(/^\/[A-Za-z0-9/_-]*$/u).default("/linq-webhook").optional(),
      webhookHost: z.string().min(1).default("0.0.0.0").optional(),
      webhookMaxBytes: z.number().int().positive().max(10 * 1024 * 1024).optional(),
      webhookReplayWindowSeconds: z.number().int().positive().max(3600).optional(),
      webhookDedupeTtlMs: z.number().int().positive().optional(),
      blockStreaming: z.boolean().optional(),
      groups: z.record(z.string(), z.unknown()).optional(),
      accounts: z.record(z.string(), LinqAccountConfigSchema).optional(),
      defaultAccount: z.string().min(1).optional(),
    })
    .strict()
    .superRefine((value, ctx) => {
      const tokenSources = [value.apiToken, value.tokenFile].filter(Boolean);
      if (tokenSources.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "configure only one of apiToken or tokenFile",
          path: ["apiToken"],
        });
      }
      if (value.groupPolicy && value.groupPolicy !== "disabled") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "group support is not enabled in this plugin version",
          path: ["groupPolicy"],
        });
      }
    }),
);

export const LinqConfigSchema = LinqAccountConfigSchema;

export const LinqConfigJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean" },
    name: { type: "string", minLength: 1 },
    apiToken: { anyOf: [{ type: "string", minLength: 1 }, { $ref: "#/$defs/secretRef" }] },
    tokenFile: { type: "string", minLength: 1 },
    fromPhone: { type: "string", pattern: "^\\+[1-9]\\d{6,14}$" },
    dmPolicy: { enum: ["pairing", "open", "disabled"], default: "open" },
    allowFrom: { type: "array", items: { anyOf: [{ type: "string" }, { type: "number" }] } },
    groupPolicy: { enum: ["disabled"], default: "disabled" },
    mediaMaxMb: { type: "number", exclusiveMinimum: 0, maximum: 100, default: 10 },
    textChunkLimit: { type: "integer", minimum: 1, maximum: 8000, default: 4000 },
    webhookUrl: { type: "string", format: "uri" },
    webhookSecret: { anyOf: [{ type: "string", minLength: 1 }, { $ref: "#/$defs/secretRef" }] },
    webhookPath: { type: "string", pattern: "^/[A-Za-z0-9/_-]*$", default: "/linq-webhook" },
    webhookHost: { type: "string", minLength: 1, default: "0.0.0.0" },
    webhookMaxBytes: { type: "integer", minimum: 1, maximum: 10485760 },
    webhookReplayWindowSeconds: { type: "integer", minimum: 1, maximum: 3600 },
    webhookDedupeTtlMs: { type: "integer", minimum: 1 },
    blockStreaming: { type: "boolean" },
    groups: { type: "object", additionalProperties: true },
    accounts: { type: "object", additionalProperties: true },
    defaultAccount: { type: "string", minLength: 1 },
  },
  $defs: {
    secretRef: {
      type: "object",
      additionalProperties: false,
      required: ["source", "id"],
      properties: {
        source: { enum: ["env", "file"] },
        provider: { type: "string", default: "default" },
        id: { type: "string", minLength: 1 },
      },
    },
  },
};
