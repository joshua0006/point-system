import React from 'react';

interface AdvancedDesignTemplateProps {
  adCopy: string;
  imageUrl: string;
  template: 'magazine' | 'social' | 'luxury' | 'tech' | 'playful' | 'minimal';
  colorScheme: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
}

export const AdvancedDesignTemplate: React.FC<AdvancedDesignTemplateProps> = ({
  adCopy,
  imageUrl,
  template,
  colorScheme
}) => {
  const colorSchemes = {
    blue: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', background: '#eff6ff' },
    purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', background: '#f3e8ff' },
    green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', background: '#ecfdf5' },
    orange: { primary: '#ea580c', secondary: '#f97316', accent: '#fb923c', background: '#fff7ed' },
    red: { primary: '#dc2626', secondary: '#ef4444', accent: '#f87171', background: '#fef2f2' },
    pink: { primary: '#db2777', secondary: '#ec4899', accent: '#f472b6', background: '#fdf2f8' }
  };

  const colors = colorSchemes[colorScheme];

  const getTemplateStyles = () => {
    const baseStyles = {
      width: '800px',
      height: '600px',
      position: 'relative' as const,
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    };

    switch (template) {
      case 'magazine':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${colors.background} 0%, white 100%)`,
          border: `3px solid ${colors.primary}15`
        };
      case 'social':
        return {
          ...baseStyles,
          background: `linear-gradient(45deg, ${colors.primary}10, ${colors.secondary}05)`,
          backdropFilter: 'blur(10px)'
        };
      case 'luxury':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)`,
          border: `2px solid ${colors.accent}`
        };
      case 'tech':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
          border: `1px solid ${colors.primary}50`
        };
      case 'playful':
        return {
          ...baseStyles,
          background: `conic-gradient(from 45deg, ${colors.background}, ${colors.primary}10, ${colors.secondary}10, ${colors.background})`,
        };
      case 'minimal':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.primary}20`
        };
      default:
        return baseStyles;
    }
  };

  const getDecorativeElements = () => {
    switch (template) {
      case 'magazine':
        return (
          <>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '8px',
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
            }} />
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.accent}40, ${colors.primary}20)`,
              backdropFilter: 'blur(5px)'
            }} />
          </>
        );
      case 'social':
        return (
          <>
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.primary}30, transparent)`,
              filter: 'blur(20px)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.secondary}40, transparent)`,
              filter: 'blur(15px)'
            }} />
          </>
        );
      case 'luxury':
        return (
          <>
            <div style={{
              position: 'absolute',
              top: '30px',
              left: '30px',
              width: '2px',
              height: '80px',
              background: `linear-gradient(to bottom, ${colors.accent}, transparent)`,
              boxShadow: `0 0 20px ${colors.accent}50`
            }} />
            <div style={{
              position: 'absolute',
              bottom: '30px',
              right: '30px',
              width: '80px',
              height: '2px',
              background: `linear-gradient(to left, ${colors.accent}, transparent)`,
              boxShadow: `0 0 20px ${colors.accent}50`
            }} />
          </>
        );
      case 'tech':
        return (
          <>
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: `radial-gradient(circle at 20% 30%, ${colors.primary}15 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${colors.secondary}10 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              border: `2px solid ${colors.primary}`,
              borderRadius: '8px',
              background: `${colors.primary}10`
            }} />
          </>
        );
      case 'playful':
        return (
          <>
            <div style={{
              position: 'absolute',
              top: '40px',
              right: '40px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: colors.accent,
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: colors.secondary,
              animation: 'pulse 3s infinite'
            }} />
          </>
        );
      default:
        return null;
    }
  };

  const getImageContainerStyles = () => {
    switch (template) {
      case 'magazine':
        return {
          position: 'absolute' as const,
          top: '40px',
          left: '40px',
          width: '45%',
          height: 'calc(100% - 80px)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: `0 20px 40px ${colors.primary}20`,
          border: `3px solid ${colors.primary}20`
        };
      case 'social':
        return {
          position: 'absolute' as const,
          top: '0',
          left: '0',
          width: '60%',
          height: '100%',
          borderRadius: '16px 0 0 16px',
          overflow: 'hidden'
        };
      case 'luxury':
        return {
          position: 'absolute' as const,
          top: '60px',
          left: '60px',
          width: 'calc(50% - 90px)',
          height: 'calc(100% - 120px)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid ${colors.accent}50`,
          boxShadow: `0 0 40px ${colors.accent}30`
        };
      case 'tech':
        return {
          position: 'absolute' as const,
          top: '80px',
          left: '40px',
          width: '50%',
          height: 'calc(100% - 160px)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${colors.primary}30`,
          boxShadow: `0 0 30px ${colors.primary}20`
        };
      case 'playful':
        return {
          position: 'absolute' as const,
          top: '30px',
          right: '30px',
          width: '50%',
          height: 'calc(70% - 30px)',
          borderRadius: '20px',
          overflow: 'hidden',
          transform: 'rotate(-2deg)',
          boxShadow: `0 25px 50px ${colors.primary}30`
        };
      case 'minimal':
        return {
          position: 'absolute' as const,
          top: '30px',
          left: '30px',
          width: '45%',
          height: 'calc(100% - 60px)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid ${colors.primary}15`
        };
      default:
        return {};
    }
  };

  const getTextContainerStyles = () => {
    switch (template) {
      case 'magazine':
        return {
          position: 'absolute' as const,
          top: '40px',
          right: '40px',
          width: '50%',
          height: 'calc(100% - 80px)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${colors.primary}10`
        };
      case 'social':
        return {
          position: 'absolute' as const,
          top: '0',
          right: '0',
          width: '40%',
          height: '100%',
          padding: '50px 40px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
          backdropFilter: 'blur(20px)'
        };
      case 'luxury':
        return {
          position: 'absolute' as const,
          top: '60px',
          right: '60px',
          width: 'calc(50% - 90px)',
          height: 'calc(100% - 120px)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          borderRadius: '8px',
          border: `1px solid ${colors.accent}30`,
          backdropFilter: 'blur(10px)'
        };
      case 'tech':
        return {
          position: 'absolute' as const,
          top: '80px',
          right: '40px',
          width: '45%',
          height: 'calc(100% - 160px)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center',
          background: 'rgba(30, 41, 59, 0.95)',
          borderRadius: '16px',
          border: `1px solid ${colors.primary}30`,
          backdropFilter: 'blur(10px)'
        };
      case 'playful':
        return {
          position: 'absolute' as const,
          bottom: '30px',
          left: '30px',
          width: 'calc(60% - 30px)',
          padding: '30px',
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderRadius: '20px',
          border: `3px solid ${colors.primary}`,
          boxShadow: `0 20px 40px ${colors.primary}20`,
          transform: 'rotate(1deg)'
        };
      case 'minimal':
        return {
          position: 'absolute' as const,
          top: '30px',
          right: '30px',
          width: '50%',
          height: 'calc(100% - 60px)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column' as const,
          justifyContent: 'center'
        };
      default:
        return {};
    }
  };

  const getTextStyles = () => {
    const isLuxury = template === 'luxury';
    const isTech = template === 'tech';
    const isDark = isLuxury || isTech;
    
    return {
      fontSize: template === 'playful' ? '20px' : '24px',
      lineHeight: '1.4',
      color: isDark ? '#ffffff' : '#1a1a1a',
      fontWeight: '600',
      textShadow: isDark ? '0 2px 4px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    };
  };

  const getBrandElementStyles = () => {
    return {
      position: 'absolute' as const,
      bottom: '20px',
      right: '20px',
      padding: '8px 16px',
      backgroundColor: colors.primary,
      color: 'white',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      boxShadow: `0 4px 12px ${colors.primary}40`
    };
  };

  // Format ad copy with enhanced typography
  const formatAdCopy = (text: string) => {
    const sentences = text.split('. ').filter(s => s.trim());
    if (sentences.length >= 2) {
      const headline = sentences[0] + '.';
      const body = sentences.slice(1).join('. ');
      return { headline, body };
    }
    return { headline: text, body: '' };
  };

  const { headline, body } = formatAdCopy(adCopy);

  return (
    <div style={getTemplateStyles()}>
      {getDecorativeElements()}
      
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
          style={{
            ...getTextStyles(),
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '16px',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: template === 'luxury' || template === 'tech' ? 'white' : 'transparent'
          }}
        >
          {headline}
        </div>
        
        {body && (
          <div
            style={{
              ...getTextStyles(),
              fontSize: '18px',
              fontWeight: '400',
              opacity: 0.9
            }}
          >
            {body}
          </div>
        )}
      </div>
      
      <div style={getBrandElementStyles()}>
        Professional
      </div>
    </div>
  );
};