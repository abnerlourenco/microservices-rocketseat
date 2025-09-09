import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";


export const cluster = new awsx.classic.ecs.Cluster('orders-cluster-app');

