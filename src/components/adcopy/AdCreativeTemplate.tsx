import React from 'react';

interface AdCreativeTemplateProps {
  adCopy: string;
  imageUrl: string;
  template: 'modern' | 'corporate' | 'social' | 'minimal';
  primaryColor?: string;
  secondaryColor?: string;
}

export const AdCreativeTemplate: React.FC<AdCreativeTemplateProps> = ({
  adCopy,
  imageUrl,
  template,
  primaryColor = '#3B82F6',
  secondaryColor = '#1E40AF'
}) => {
  const getTemplateStyles = () => {
    const baseStyles = {
      width: '800px',
      height: '600px',
      position: 'relative' as const,
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    };

    switch (template) {
      case 'modern':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)`,
        };
      case 'corporate':
        return {
          ...baseStyles,
          backgroundColor: '#f8fafc',
          border: `2px solid ${primaryColor}20`
        };
      case 'social':
        return {
          ...baseStyles,
          background: `linear-gradient(45deg, ${primaryColor}10, ${secondaryColor}10)`,
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0'
        };
      default:
        return baseStyles;
    }
  };

  const getImageContainerStyles = () => {
    switch (template) {
      case 'modern':
        return {
          position: 'absolute' as const,
          top: '0',
          left: '0',
          width: '50%',
          height: '100%',
          borderRadius: '12px 0 0 12px',
          overflow: 'hidden'
        };
      case 'corporate':
        return {
          position: 'absolute' as const,
          top: '40px',
          left: '40px',
          width: 'calc(100% - 80px)',
          height: '300px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `2px solid ${primaryColor}30`
        };
      case 'social':
        return {
          position: 'absolute' as const,
          top: '0',
          left: '0',
          width: '100%',
          height: '60%',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden'
        };
      case 'minimal':
        return {
          position: 'absolute' as const,
          top: '30px',
          left: '30px',
          width: '45%',
          height: 'calc(100% - 60px)',
          borderRadius: '6px',
          overflow: 'hidden'
        };
      default:
        return {};
    }
  };

  const getTextContainerStyles = () => {
    switch (template) {
      case 'modern':
        return {
          position: 'absolute' as const,
          top: '0',
          right: '0',
          width: '50%',
          height: '100%',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}05 100%)`
        };
      case 'corporate':
        return {
          position: 'absolute' as const,
          bottom: '40px',
          left: '40px',
          right: '40px',
          padding: '30px',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${primaryColor}20`
        };
      case 'social':
        return {
          position: 'absolute' as const,
          bottom: '0',
          left: '0',
          right: '0',
          height: '40%',
          padding: '30px',
          backgroundColor: 'rgba(255,255,255,0.98)',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center'
        };
      case 'minimal':
        return {
          position: 'absolute' as const,
          top: '30px',
          right: '30px',
          width: '45%',
          height: 'calc(100% - 60px)',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center'
        };
      default:
        return {};
    }
  };

  const getTextStyles = () => {
    switch (template) {
      case 'modern':
        return {
          fontSize: '24px',
          lineHeight: '1.4',
          color: '#1e293b',
          fontWeight: '600',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        };
      case 'corporate':
        return {
          fontSize: '20px',
          lineHeight: '1.5',
          color: '#334155',
          fontWeight: '500'
        };
      case 'social':
        return {
          fontSize: '22px',
          lineHeight: '1.4',
          color: '#0f172a',
          fontWeight: '600'
        };
      case 'minimal':
        return {
          fontSize: '18px',
          lineHeight: '1.6',
          color: '#374151',
          fontWeight: '400'
        };
      default:
        return {};
    }
  };

  const getAccentStyles = () => {
    switch (template) {
      case 'modern':
        return {
          position: 'absolute' as const,
          top: '0',
          left: '50%',
          width: '4px',
          height: '100%',
          background: `linear-gradient(to bottom, ${primaryColor}, ${secondaryColor})`
        };
      case 'corporate':
        return {
          position: 'absolute' as const,
          top: '0',
          left: '0',
          right: '0',
          height: '6px',
          background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
        };
      case 'social':
        return {
          position: 'absolute' as const,
          bottom: '40%',
          left: '0',
          right: '0',
          height: '3px',
          background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
        };
      case 'minimal':
        return {
          position: 'absolute' as const,
          top: '30px',
          left: '0',
          width: '6px',
          height: '60px',
          backgroundColor: primaryColor,
          borderRadius: '0 3px 3px 0'
        };
      default:
        return {};
    }
  };

  // Clean and format ad copy
  const formatAdCopy = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div style={getTemplateStyles()}>
      <div style={getAccentStyles()}></div>
      
      <div style={getImageContainerStyles()}>
        <img
          src={imageUrl}
          alt="Ad Creative"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>
      
      <div style={getTextContainerStyles()}>
        <div
          style={getTextStyles()}
          dangerouslySetInnerHTML={{
            __html: `<p>${formatAdCopy(adCopy)}</p>`
          }}
        />
      </div>
    </div>
  );
};