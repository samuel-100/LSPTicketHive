#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { LSPTicketHiveStack } from "../lib/stack";

const app = new cdk.App();

new LSPTicketHiveStack(app, "LSPTicketHive", {
  env: {
    account: "951151046842",
    region: "eu-west-1",
  },
});
