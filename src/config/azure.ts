export interface AzureEmailConfig {
  connectionString: string;
  fromEmail: string;
  adminEmail: string;
}

// Azure Communication Services configuration
export const azureEmailConfig = {
  connectionString: process.env.AZURE_COMMUNICATION_CONNECTION_STRING || '',
  fromEmail: process.env.AZURE_FROM_EMAIL || '',
  adminEmail: process.env.AZURE_ADMIN_EMAIL || '',
};

export function validateAzureConfig(): boolean {
  console.log('Validating Azure configuration...');
  
  const issues: string[] = [];
  
  // Check connection string
  if (!azureEmailConfig.connectionString) {
    issues.push('AZURE_COMMUNICATION_CONNECTION_STRING is not set');
    console.error('Configuration validation failed: Connection string is not set');
  } else {
    // Validate connection string format
    const connectionString = azureEmailConfig.connectionString;
    
    console.log('Validating connection string format:', {
      rawLength: connectionString.length,
      hasEndpoint: connectionString.includes('endpoint='),
      hasAccessKey: connectionString.includes('accesskey='),
      hasSemicolon: connectionString.includes(';accesskey='),
      startsWithEndpoint: connectionString.startsWith('endpoint=')
    });
    
    // Azure Communication Services connection string should have this format:
    // endpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key
    if (!connectionString.includes('endpoint=')) {
      issues.push('Connection string missing endpoint parameter');
    }
    
    if (!connectionString.includes('accesskey=')) {
      issues.push('Connection string missing accesskey parameter');
    }
    
    // Check if it has the proper separator
    if (!connectionString.includes(';accesskey=')) {
      issues.push('Connection string missing semicolon separator before accesskey');
    }
    
    // Log the format for debugging (without exposing the actual key)
    const hasValidFormat = connectionString.includes('endpoint=') && connectionString.includes(';accesskey=');
    console.log('Connection string format check:', {
      hasEndpoint: connectionString.includes('endpoint='),
      hasAccessKey: connectionString.includes('accesskey='),
      hasValidFormat,
      length: connectionString.length,
      preview: connectionString.substring(0, 50) + '...',
      // Check for common formatting issues
      hasProperSeparator: connectionString.includes(';accesskey='),
      startsWithEndpoint: connectionString.startsWith('endpoint='),
      // Check for extra whitespace or newlines
      hasTrimIssues: connectionString !== connectionString.trim(),
      actualValue: `"${connectionString.substring(0, 60)}..."` // Show quotes to reveal whitespace issues, shorten the preview
    });
  }
  
  // Check from email
  if (!azureEmailConfig.fromEmail) {
    issues.push('AZURE_FROM_EMAIL is not set');
  } else {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(azureEmailConfig.fromEmail)) {
      issues.push('AZURE_FROM_EMAIL format appears invalid');
    }
    console.log('From email validation:', {
      email: azureEmailConfig.fromEmail,
      isValid: emailRegex.test(azureEmailConfig.fromEmail)
    });
  }
  
  // Check admin email
  if (!azureEmailConfig.adminEmail) {
    issues.push('AZURE_ADMIN_EMAIL is not set');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(azureEmailConfig.adminEmail)) {
      issues.push('AZURE_ADMIN_EMAIL format appears invalid');
    }
    console.log('Admin email validation:', {
      email: azureEmailConfig.adminEmail,
      isValid: emailRegex.test(azureEmailConfig.adminEmail)
    });
  }
  
  if (issues.length > 0) {
    console.error('Azure configuration issues:', issues);
    return false;
  }
  
  console.log('Azure configuration validation passed');
  return true;
}

// Helper function to check if Azure services are properly configured
export function getAzureConfigStatus() {
  return {
    hasConnectionString: !!azureEmailConfig.connectionString,
    hasFromEmail: !!azureEmailConfig.fromEmail,
    hasAdminEmail: !!azureEmailConfig.adminEmail,
    isValid: validateAzureConfig(),
    connectionStringFormat: azureEmailConfig.connectionString ? {
      hasEndpoint: azureEmailConfig.connectionString.includes('endpoint='),
      hasAccessKey: azureEmailConfig.connectionString.includes('accesskey='),
      isComplete: azureEmailConfig.connectionString.includes('endpoint=') && azureEmailConfig.connectionString.includes(';accesskey='),
      trimmed: azureEmailConfig.connectionString === azureEmailConfig.connectionString.trim()
    } : null
  };
}