import { createCustomer, createSubscription } from "../services/asaas.service";

async function test() {
  try {
    const customer = await createCustomer("Test User", "test@test.com", {
      cpfCnpj: "00000000000",
      phone: "11999999999"
    });
    console.log("Customer:", customer);
    
    const sub = await createSubscription(customer.id, "PRO");
    console.log("Subscription:", sub);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
