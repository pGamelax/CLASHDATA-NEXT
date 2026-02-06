import { Elysia, t } from "elysia";
import { MembersController } from "../controllers/members.controller";
import { MemberService } from "../services/member.service";
import { MemberRepository } from "../repositories/member.repository";
import { OrganizationRepository } from "../repositories/organization.repository";

// Inicializa dependências
const memberRepository = new MemberRepository();
const organizationRepository = new OrganizationRepository();
const memberService = new MemberService(memberRepository, organizationRepository);
const membersController = new MembersController(memberService);

export const membersRoutes = new Elysia({ prefix: "/members" })
  .delete(
    "/organization/:organizationId",
    async (context) => await membersController.removeMember(context),
    {
      params: t.Object({
        organizationId: t.String(),
      }),
      body: t.Object({
        userId: t.String(),
      }),
      detail: {
        tags: ["Members"],
        summary: "Remover membro",
        description: "Remove um membro de uma organização. Apenas o dono pode remover.",
      },
    }
  );
