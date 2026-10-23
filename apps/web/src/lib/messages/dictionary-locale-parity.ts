/**
 * Compile-time parity between `ru` and `en` JSON namespaces (ADR-008 §4.1.5).
 * A missing or extra key fails `tsc` when this module is typechecked.
 */
import enAdmin from "@/lib/messages/en/admin.json";
import enAnalytics from "@/lib/messages/en/analytics.json";
import enAuth from "@/lib/messages/en/auth.json";
import enCommon from "@/lib/messages/en/common.json";
import enTeacher from "@/lib/messages/en/teacher.json";
import enParent from "@/lib/messages/en/parent.json";
import ruAdmin from "@/lib/messages/ru/admin.json";
import ruAnalytics from "@/lib/messages/ru/analytics.json";
import ruAuth from "@/lib/messages/ru/auth.json";
import ruCommon from "@/lib/messages/ru/common.json";
import ruTeacher from "@/lib/messages/ru/teacher.json";
import ruParent from "@/lib/messages/ru/parent.json";

enCommon satisfies typeof ruCommon;
ruCommon satisfies typeof enCommon;
enAuth satisfies typeof ruAuth;
ruAuth satisfies typeof enAuth;
enTeacher satisfies typeof ruTeacher;
ruTeacher satisfies typeof enTeacher;
enAdmin satisfies typeof ruAdmin;
ruAdmin satisfies typeof enAdmin;
enAnalytics satisfies typeof ruAnalytics;
ruAnalytics satisfies typeof enAnalytics;
enParent satisfies typeof ruParent;
ruParent satisfies typeof enParent;
