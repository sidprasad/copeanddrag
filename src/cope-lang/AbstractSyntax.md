Program ::= Constraint* Directive*

Constraint ::= CyclicConstraint 
             | OrientationConstraint 
             | GroupingConstraint

CyclicConstraint ::= FieldName FlowDirection

OrientationConstraint ::= FieldName Direction+ 
                        | SigName SigName Direction+

GroupingConstraint ::= FieldName Target

FlowDirection ::= clockwise | counterclockwise
Direction ::= above | below | left | right | directlyAbove | directlyBelow | directlyLeft | directlyRight
Target ::= domain | range

///////// Directives /////////

Directive ::= PictorialDirective 
             | ThemingDirective

PictorialDirective ::= SigName IconDefinition

ThemingDirective ::= AttributeDirective
                   | SigColorDirective
                   | ProjectionDirective
                   | VisibilityFlag

IconDefinition ::= path height width
AttributeDirective ::= FieldName 
SigColorDirective ::= SigName color
ProjectionDirective ::= SigName
VisibilityFlag ::= hideDisconnected | hideDisconnectedBuiltIns
