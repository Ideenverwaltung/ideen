"use client";

import { CredentialsSection } from "@/components/credentials-section";
import { VaultGate } from "@/components/vault-gate";

export default function TresorPage() {
  return (
    <div className="animate-in space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Login-Tresor</h1>
        <p className="mt-1 text-muted">
          Alle Zugangsdaten – Ende-zu-Ende verschlüsselt mit deinem Master-Passwort.
        </p>
      </header>
      <VaultGate>
        <CredentialsSection showProjectColumn />
      </VaultGate>
    </div>
  );
}
