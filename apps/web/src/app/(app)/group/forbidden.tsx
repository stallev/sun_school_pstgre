import { homeRouteFor } from "@sunschool/policy-edge";
import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { Button } from "@/components/ui/button";
import { CustomLink } from "@/components/ui/custom-link";
import { requireActiveUser } from "@/lib/auth/require-user";
import { shouldShowGroupTeacherForbiddenForAdmin } from "@/lib/auth/group-teacher-forbidden";
import { getUiLocale } from "@/lib/i18n/get-ui-locale.server";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

const GroupForbidden = async () => {
  const context = await requireActiveUser();
  const locale = await getUiLocale();
  const common = await getDictionary(locale, "common");
  const homeHref = homeRouteFor(context.status, context.roles);

  if (shouldShowGroupTeacherForbiddenForAdmin(context.roles)) {
    return (
      <ForbiddenState
        title={getMessage(common, "errors.forbidden_group_teacher_title")}
        description={getMessage(common, "errors.forbidden_group_teacher_description")}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button render={<CustomLink href="/groups" />} variant="outline">
              {getMessage(common, "shell.forbidden_groups_list")}
            </Button>
            <Button render={<CustomLink href={homeHref} />}>
              {getMessage(common, "shell.forbidden_home")}
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <ForbiddenState
      title={getMessage(common, "errors.forbidden_title")}
      description={getMessage(common, "errors.forbidden")}
      action={
        <Button render={<CustomLink href={homeHref} />}>
          {getMessage(common, "shell.forbidden_home")}
        </Button>
      }
    />
  );
};

export default GroupForbidden;
