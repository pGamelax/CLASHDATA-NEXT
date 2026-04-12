import { auth } from "../../auth";
import Elysia from "elysia";
import { env } from "../../env";

const corsOrigin = env.CORS_ORIGIN;
const allowedOrigins = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];

function withCors(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request) => {
    const origin = req.headers.get("origin") ?? "";
    const isAllowed = allowedOrigins.includes(origin);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": isAllowed ? origin : "",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    const response = await handler(req);

    if (isAllowed) {
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  };
}

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(withCors(auth.handler))
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) {
          return status(401, { message: "Unauthorized" });
        }

        return session;
      },
    },
  });

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
  getPaths: (prefix = "/auth") =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        reference[key] = paths[path];

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method];

          operation.tags = ["Better Auth"];
        }
      }

      return reference;
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;
