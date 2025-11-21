import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
});

// Configure Node.js 22.x runtime for all Lambda functions created by Amplify
// This updates the AppSync resolver Lambda functions to use Node.js 22.x
const dataStack = backend.data.resources.cfnResources;
if (dataStack.cfnGraphqlApi) {
  // Iterate through all child resources to find Lambda functions
  dataStack.cfnGraphqlApi.node.findAll().forEach((child) => {
    if (child.node.defaultChild?.cfnResourceType === 'AWS::Lambda::Function') {
      child.node.defaultChild.addPropertyOverride('Runtime', 'nodejs22.x');
    }
  });
}
