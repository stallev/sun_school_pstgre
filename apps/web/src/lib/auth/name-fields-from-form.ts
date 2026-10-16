/** Maps registration / profile name fields from FormData (null middleName → omitted). */
export const nameFieldsFromForm = (formData: FormData) => {
  const middleNameRaw = formData.get("middleName");
  const middleName =
    middleNameRaw === null || middleNameRaw === "" ? undefined : String(middleNameRaw);
  return {
    lastName: String(formData.get("lastName") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    middleName,
  };
};
