import { Heading } from "@/components/atoms";
import { Container } from "@/components/ui/container";
import { RegisterClientForm } from "@/components/auth/RegisterClientForm.client";
import { getMessages } from "@/lib/messages/server";


export default async function RegisterPage() {
  const messages = await getMessages();
  return (
    <div className="flex flex-1 flex-col justify-center py-8">
      <Container variant="narrow" className="mx-auto w-full max-w-md px-4">
        <Heading as="h1" className="mb-6 text-center">
          {messages.auth.register.title}
        </Heading>
        <RegisterClientForm />
      </Container>
    </div>
  );
}
