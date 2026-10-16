import { ForbiddenState } from "@/components/patterns/ForbiddenState";
import { getDictionary, getMessage } from "@/lib/messages/get-dictionary";

/**
 * AZ-D3 page: `forbidden()` from `requireRole` renders this (needs `experimental.authInterrupts`).
 * TODO(P01-CU6): resolve the locale from `app_setting.ui_locale` and wrap in the shell; until then
 * the Russian default of the app is used.
 */
const Forbidden = async () => {
  const common = await getDictionary("ru", "common");
  return (
    <main className="mx-auto max-w-xl p-4">
      <ForbiddenState
        title={getMessage(common, "errors.forbidden_title")}
        description={getMessage(common, "errors.forbidden")}
      />
    </main>
  );
};

export default Forbidden;
