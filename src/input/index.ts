import type { InputParser } from "@/@types";

import { EmptyParser } from "./empty";
import { FormattedParser } from "./formatted";
import { LegacyParser } from "./legacy";
import { LegacyOwnerParser } from "./legacyOwner";
import { OwnerParser } from "./owner";
import { V1Parser } from "./v1";
import { XmlDocumentParser } from "./xmlDocument";

export const parsers: InputParser[] = [
  EmptyParser,
  FormattedParser,
  LegacyParser,
  LegacyOwnerParser,
  OwnerParser,
  V1Parser,
  XmlDocumentParser,
];
