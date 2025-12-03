import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isCognitoConfigured } from '@/config/cognito';

export const ConfigWarning = () => {
  if (isCognitoConfigured()) return null;

  return (
    <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500">Authentication Not Configured</AlertTitle>
      <AlertDescription className="text-amber-200">
        AWS Cognito credentials are not set. Authentication features are disabled.
        <br />
        To enable auth, create a <code className="bg-black/30 px-1 rounded">.env</code> file with your Cognito details.
      </AlertDescription>
    </Alert>
  );
};
