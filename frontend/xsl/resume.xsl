<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <!-- ═══════════════════════════════════════════════════════════
       ROOT
  ═══════════════════════════════════════════════════════════ -->
  <xsl:template match="/resume">
    <div class="rf-preview-doc">

      <!-- HEADER -->
      <div class="rfp-header">
        <h1 class="rfp-name"><xsl:value-of select="personal/name"/></h1>
        <div class="rfp-contact">
          <xsl:if test="personal/email != ''">
            <span>✉ <xsl:value-of select="personal/email"/></span>
          </xsl:if>
          <xsl:if test="personal/phone != ''">
            <span><xsl:value-of select="personal/phone"/></span>
          </xsl:if>
          <xsl:if test="personal/linkedin != ''">
            <span>
              <a>
                <xsl:attribute name="href">https://<xsl:value-of select="personal/linkedin"/></xsl:attribute>
                <xsl:value-of select="personal/linkedin"/>
              </a>
            </span>
          </xsl:if>
          <xsl:if test="personal/github != ''">
            <span>
              <a>
                <xsl:attribute name="href">https://<xsl:value-of select="personal/github"/></xsl:attribute>
                <xsl:value-of select="personal/github"/>
              </a>
            </span>
          </xsl:if>
        </div>
      </div>

      <!-- EDUCATION -->
      <xsl:if test="education/institution != ''">
        <div class="rfp-section">
          <div class="rfp-section-title">Education</div>
          <div class="rfp-entry">
            <div class="rfp-row">
              <strong><xsl:value-of select="education/institution"/></strong>
              <span class="rfp-right"><xsl:value-of select="education/location"/></span>
            </div>
            <div class="rfp-row">
              <em>
                <xsl:value-of select="education/degree"/>
                <xsl:if test="education/gpa != ''">
                  &#160;—&#160;<strong>GPA: <xsl:value-of select="education/gpa"/></strong>
                </xsl:if>
              </em>
              <span class="rfp-right"><xsl:value-of select="education/graduation"/></span>
            </div>
            <xsl:if test="education/coursework != ''">
              <ul class="rfp-bullets">
                <li><strong>Relevant Coursework:</strong>&#160;<xsl:value-of select="education/coursework"/></li>
              </ul>
            </xsl:if>
            <xsl:if test="education/achievement != ''">
              <ul class="rfp-bullets">
                <li><strong>Achievement:</strong>&#160;<xsl:value-of select="education/achievement"/></li>
              </ul>
            </xsl:if>
          </div>
        </div>
      </xsl:if>

      <!-- TECHNICAL SKILLS -->
      <xsl:if test="skills/skill-group">
        <div class="rfp-section">
          <div class="rfp-section-title">Technical Skills</div>
          <div class="rfp-entry">
            <xsl:apply-templates select="skills/skill-group"/>
          </div>
        </div>
      </xsl:if>

      <!-- EXPERIENCE -->
      <xsl:if test="experience/job">
        <div class="rfp-section">
          <div class="rfp-section-title">Experience</div>
          <xsl:apply-templates select="experience/job"/>
        </div>
      </xsl:if>

      <!-- PROJECTS -->
      <xsl:if test="projects/project">
        <div class="rfp-section">
          <div class="rfp-section-title">Projects</div>
          <xsl:apply-templates select="projects/project"/>
        </div>
      </xsl:if>

      <!-- ACHIEVEMENTS -->
      <xsl:if test="achievements/item">
        <div class="rfp-section">
          <div class="rfp-section-title">Achievements &amp; Extracurriculars</div>
          <xsl:apply-templates select="achievements/item"/>
        </div>
      </xsl:if>

    </div>
  </xsl:template>

  <!-- ═══════════════════════════════════════════════════════════
       SKILL GROUP
  ═══════════════════════════════════════════════════════════ -->
  <xsl:template match="skill-group">
    <div class="rfp-skill-row">
      <strong><xsl:value-of select="@name"/>:</strong>
      &#160;<xsl:value-of select="."/>
    </div>
  </xsl:template>

  <!-- ═══════════════════════════════════════════════════════════
       JOB
  ═══════════════════════════════════════════════════════════ -->
  <xsl:template match="job">
    <div class="rfp-entry">
      <div class="rfp-row">
        <span>
          <strong><xsl:value-of select="company"/></strong>
          <xsl:if test="company-note != ''">
            &#160;<em>(<xsl:value-of select="company-note"/>)</em>
          </xsl:if>
        </span>
        <span class="rfp-right"><xsl:value-of select="location"/></span>
      </div>
      <div class="rfp-row">
        <em><xsl:value-of select="title"/></em>
        <span class="rfp-right rfp-period"><xsl:value-of select="period"/></span>
      </div>
      <xsl:if test="bullets/bullet">
        <ul class="rfp-bullets">
          <xsl:apply-templates select="bullets/bullet"/>
        </ul>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- ═══════════════════════════════════════════════════════════
       PROJECT
  ═══════════════════════════════════════════════════════════ -->
  <xsl:template match="project">
    <div class="rfp-entry">
      <div class="rfp-row">
        <span>
          <strong><xsl:value-of select="name"/></strong>
          <xsl:if test="tech != ''">
            &#160;<span class="rfp-tech">| <em><xsl:value-of select="tech"/></em></span>
          </xsl:if>
        </span>
        <span class="rfp-right"><xsl:value-of select="period"/></span>
      </div>
      <xsl:if test="bullets/bullet">
        <ul class="rfp-bullets">
          <xsl:apply-templates select="bullets/bullet"/>
        </ul>
      </xsl:if>
      <xsl:if test="links/link">
        <div class="rfp-links">
          <xsl:apply-templates select="links/link"/>
        </div>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- ═══════════════════════════════════════════════════════════
       ACHIEVEMENT
  ═══════════════════════════════════════════════════════════ -->
  <xsl:template match="achievements/item">
    <div class="rfp-entry">
      <div class="rfp-row">
        <span>
          <strong><xsl:value-of select="title"/></strong>
          <xsl:if test="subtitle != ''">
            &#160;| <em><xsl:value-of select="subtitle"/></em>
          </xsl:if>
        </span>
        <span class="rfp-right"><xsl:value-of select="period"/></span>
      </div>
      <xsl:if test="bullets/bullet">
        <ul class="rfp-bullets">
          <xsl:apply-templates select="bullets/bullet"/>
        </ul>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- ═══════════════════════════════════════════════════════════
       SHARED — bullet + link
  ═══════════════════════════════════════════════════════════ -->
  <xsl:template match="bullet">
    <li><xsl:value-of select="."/></li>
  </xsl:template>

  <xsl:template match="link">
    <a>
      <xsl:attribute name="href"><xsl:value-of select="@href"/></xsl:attribute>
      <xsl:attribute name="target">_blank</xsl:attribute>
      <xsl:value-of select="."/>
    </a>
    <xsl:if test="position() != last()">&#160;|&#160;</xsl:if>
  </xsl:template>

</xsl:stylesheet>
